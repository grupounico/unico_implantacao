import { api } from "./api";
import { requireAuthSession } from "../utils/authSession";

// Definindo a tipagem da resposta paginada
export interface DatabaseItem {
    name: string;
    size: string;
}

export interface DatabaseConnectionPayload {
    host: string;
    port: number;
    database: string;
    user: string;
    password: string;
    ssl: boolean;
    cnpj?: string;
}

export interface DatabaseBusinessUnitLookup {
    requestedCnpj: string;
    found: boolean;
    message: string;
    unit: {
        id: number;
        status: string | null;
        codigo: string | null;
        nome: string | null;
        cnpj: string | null;
        nomeFantasia: string | null;
        razaoSocial: string | null;
    } | null;
}

export interface DatabaseConnectionResult {
    success: boolean;
    message: string;
    latencyMs: number;
    details: {
        host: string;
        port: number;
        database: string;
        user: string;
        ssl: boolean;
    };
    businessUnitLookup: DatabaseBusinessUnitLookup | null;
}

export interface DatabaseIntegrationStatusResult {
    success: boolean;
    message: string;
    latencyMs: number;
    database: string;
    requirements: {
        schema: string;
        table: string;
        tableExists: boolean;
        hasProducts: boolean;
        productCount: number;
        productCountSource: 'exact' | 'estimated';
        hasReadAccess: boolean;
    };
    readyForIntegration: boolean;
}

export interface PaginatedResponse {
    data: DatabaseItem[];
    meta: {
        page: number;
        limit: number;
        totalItems: number;
        totalPages: number;
    }
}

export async function getDatabases(page = 1, limit = 9, search = '') {
    // Enviamos como params na URL
    const response = await api.get<PaginatedResponse>('api/databases', {
        params: {
            page,
            limit,
            search
        }/* , headers:{
            'x-api-key': import.meta.env.VITE_ADMIN_API_KEY,
        } */
    });
    return response.data;
}

export async function createDatabase(name: string) {

    const username = requireAuthSession().authUsername
    const response = await api.post(
        'api/databases/createDatabase', // URL completa conforme sua rota
        { name,  username}, // Body do POST
        {
            /* headers: {
                'x-api-key': import.meta.env.VITE_ADMIN_API_KEY,
            } */
        }
    );
    return response.data;
}

export async function testDatabaseConnection(payload: DatabaseConnectionPayload) {
    const username = requireAuthSession().authUsername
    const response = await api.post<DatabaseConnectionResult>(
        'api/databases/testConnection',
        {
            ...payload,
            username,
        }
    );
    return response.data;
}

export async function checkIntegrationDatabaseStatus(database: string) {
    const username = requireAuthSession().authUsername
    const response = await api.post<DatabaseIntegrationStatusResult>(
        'api/databases/checkIntegrationStatus',
        {
            database,
            username,
        }
    );
    return response.data;
}
