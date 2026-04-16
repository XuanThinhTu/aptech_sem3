import { DatabaseService } from './database.service';
export declare class DatabaseController {
    private readonly databaseService;
    constructor(databaseService: DatabaseService);
    getSchemaOverview(): {
        collections: {
            name: string;
            purpose: string;
        }[];
        keyRules: string[];
    };
}
