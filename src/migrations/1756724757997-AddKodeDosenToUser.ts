import { MigrationInterface, QueryRunner } from "typeorm";

export class AddKodeDosenOnly1730450000000 implements MigrationInterface {
    name = 'AddKodeDosenOnly1730450000000'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            ALTER TABLE users 
            ADD COLUMN kode_dosen VARCHAR(20) NULL
        `);
        
        await queryRunner.query(`
            CREATE UNIQUE INDEX IDX_users_kode_dosen 
            ON users (kode_dosen)
        `);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            DROP INDEX IDX_users_kode_dosen ON users
        `);
        
        await queryRunner.query(`
            ALTER TABLE users 
            DROP COLUMN kode_dosen
        `);
    }
}