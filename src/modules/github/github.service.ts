import {
  BadRequestException,
  Injectable,
  InternalServerErrorException,
  Logger,
} from '@nestjs/common';
import { IFetchListRepos } from './types/fetch-list.repos.interface';
import { ParamsDetailsDto } from './dto/params-get-details.repos.dto';
import { IFetchDetailsRepos } from './types/fetch-details.repos.inreface';

@Injectable()
export class GithubService {
  private state = 0;
  private readonly gitApiUrl = 'https://api.github.com';

  async fetchRepos(token: string): Promise<IFetchListRepos[]> {
    let allRepos: IFetchListRepos[] = [];
    let page = 1;

    while (true) {
      const res = await fetch(
        `${this.gitApiUrl}/user/repos?per_page=100&page=${page}`,
        {
          headers: this.headers(token),
        },
      );

      if (!res.ok) {
        throw new BadRequestException(
          `Failed to fetch repositories on page ${page}, status text: ${res.statusText}`,
        );
      }

      const repos = await res.json();

      if (repos.length === 0) {
        break;
      }

      allRepos = [
        ...allRepos,
        ...repos.map((r) => ({
          name: r.name,
          size: r.size,
          owner: r.owner.login,
        })),
      ];

      page++;
    }

    return allRepos;
  }

  async fetchRepoDetails(
    paramsDetailsDto: ParamsDetailsDto,
  ): Promise<IFetchDetailsRepos> {
    this.validateOrIncreaseState();
    const { owner, repo, token } = paramsDetailsDto;
    try {
      const headers = this.headers(token);

      const [repoRes, hooksRes] = await Promise.all([
        fetch(`${this.gitApiUrl}/repos/${owner}/${repo}`, { headers }),
        fetch(`${this.gitApiUrl}/repos/${owner}/${repo}/hooks`, { headers }),
      ]);

      if (!repoRes.ok) {
        throw new BadRequestException(
          `Failed to fetch repository, status text: ${repoRes.statusText}`,
        );
      }

      if (!hooksRes.ok) {
        throw new BadRequestException(
          `Failed to fetch hooks, status text: ${hooksRes.statusText}`,
        );
      }

      const [repoData, webhooks] = await Promise.all([
        repoRes.json(),
        hooksRes.json(),
      ]);

      const { fileCount, ymlContent } =
        await this.getCountFilesAndYamlFileContent(token, owner, repo);

      return {
        name: repoData.name,
        size: repoData.size,
        owner: repoData.owner.login,
        private: repoData.private,
        webhooks,
        fileCount,
        ymlContent,
      };
    } catch (err) {
      Logger.error('GitHub fetch failed', err);
      throw new InternalServerErrorException('Failed to fetch GitHub data');
    } finally {
      this.state -= 1;
    }
  }

  async getCountFilesAndYamlFileContent(
    token: string,
    owner: string,
    repo: string,
  ) {
    const headers = this.headers(token);
    let fileCount = 0;
    let ymlContent;

    const walk = async (path = '.') => {
      const url = `https://api.github.com/repos/${owner}/${repo}/contents/${path}`;
      const res = await fetch(url, { headers });

      if (!res.ok) {
        throw new Error(`Failed to fetch path ${path}: ${res.statusText}`);
      }

      const items = await res.json();

      for (const item of items) {
        if (item.type === 'dir') {
          await walk(item.path);
        }

        if (item.type === 'file') {
          fileCount++;

          if (
            !ymlContent &&
            (item.name.endsWith('.yml') || item.name.endsWith('.yaml'))
          ) {
            const ymlRes = await fetch(item.download_url);
            if (ymlRes.ok) {
              ymlContent = await ymlRes.text();
            }
          }
        }
      }
    };

    await walk();
    return { fileCount, ymlContent };
  }

  private headers(token: string) {
    return {
      Authorization: `Bearer ${token}`,
      Accept: 'application/vnd.github+json',
      'X-GitHub-Api-Version': '2022-11-28',
    };
  }

  validateOrIncreaseState() {
    if (this.state === 2) {
      throw new BadRequestException(`Maximum 2 repo's in parallel!`);
    }
    this.state += 1;
  }
}
