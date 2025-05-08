export interface IFetchDetailsRepos {
  name: string;
  size: number;
  owner: string;
  private: boolean;
  webhooks: unknown[];
  fileCount: number;
  ymlContent?: string;
}
