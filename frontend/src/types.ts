export interface Model {
  id: number;
  name: string;
  description: string;
  category: string;
  downloads: number;
  likes: number;
  trending: boolean;
  tags: string[];
  updated: string;
  author: number;
  author_username?: string;
  file_path: string;
  license: string;
}
