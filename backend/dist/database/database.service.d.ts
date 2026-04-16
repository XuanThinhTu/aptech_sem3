export declare class DatabaseService {
    getSchemaOverview(): {
        collections: {
            name: string;
            purpose: string;
        }[];
        keyRules: string[];
    };
}
