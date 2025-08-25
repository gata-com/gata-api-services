import { MigrationInterface, QueryRunner } from "typeorm";

export class AddAnggotaTA1756096512387 implements MigrationInterface {
    name = 'AddAnggotaTA1756096512387'

    public async up(queryRunner: QueryRunner): Promise<void> {
        // Hanya buat table anggota_ta yang baru
        await queryRunner.query(`CREATE TABLE \`anggota_ta\` (\`id\` int NOT NULL AUTO_INCREMENT, \`urutan\` int NOT NULL, \`createdAt\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6), \`updatedAt\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6), \`pendaftaranTAId\` int NULL, \`mahasiswaId\` int NULL, PRIMARY KEY (\`id\`)) ENGINE=InnoDB`);
        
        // Tambahkan foreign key constraints
        await queryRunner.query(`ALTER TABLE \`anggota_ta\` ADD CONSTRAINT \`FK_cc97938f9e93720a44bbd6d44ba\` FOREIGN KEY (\`pendaftaranTAId\`) REFERENCES \`pendaftaran_ta\`(\`id\`) ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE \`anggota_ta\` ADD CONSTRAINT \`FK_34864bc5db71011e452d9a682b2\` FOREIGN KEY (\`mahasiswaId\`) REFERENCES \`mahasiswa\`(\`id\`) ON DELETE NO ACTION ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        // Hapus foreign key constraints dulu
        await queryRunner.query(`ALTER TABLE \`anggota_ta\` DROP FOREIGN KEY \`FK_34864bc5db71011e452d9a682b2\``);
        await queryRunner.query(`ALTER TABLE \`anggota_ta\` DROP FOREIGN KEY \`FK_cc97938f9e93720a44bbd6d44ba\``);
        
        // Baru hapus table
        await queryRunner.query(`DROP TABLE \`anggota_ta\``);
    }
}