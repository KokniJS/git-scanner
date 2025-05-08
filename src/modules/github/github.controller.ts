import { Controller, Get, Param } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { GithubService } from './github.service';
import { ParamsDetailsDto } from './dto/params-get-details.repos.dto';
import { ParamsListDto } from './dto/params-get-list.repos.dto';

@ApiTags('GitHub Scanner')
@Controller('repos/:token')
export class GithubController {
  constructor(private readonly githubService: GithubService) {}

  @Get('list')
  @ApiOperation({ summary: 'Get list of repositories' })
  async listRepos(@Param() { token }: ParamsListDto) {
    return this.githubService.fetchRepos(token);
  }

  @Get(':owner/:repo')
  @ApiOperation({ summary: 'Get repository details' })
  async getRepo(@Param() paramsDetailsDto: ParamsDetailsDto) {
    return this.githubService.fetchRepoDetails(paramsDetailsDto);
  }

  @Get(':owner/:repo/parallel-test')
  async testParallel(@Param() paramsDetailsDto: ParamsDetailsDto) {
    return Promise.all([
      this.githubService.fetchRepoDetails(paramsDetailsDto),
      this.githubService.fetchRepoDetails(paramsDetailsDto),
      this.githubService.fetchRepoDetails(paramsDetailsDto),
      this.githubService.fetchRepoDetails(paramsDetailsDto),
    ]);
  }
}
