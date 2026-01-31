export const CONFIGURATION_SERVICE = 'ConfigurationService';

export interface ConfigurationService {
  get(key: string): string;
  getNumber(key: string): number;
}
