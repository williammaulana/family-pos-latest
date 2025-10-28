export interface Repository {
    name: string;
    path: string;
    currentBranch?: string;
    hasChanges?: boolean;
    remoteUrl?: string;
    lastModified?: number;
    isCustom?: boolean;
}