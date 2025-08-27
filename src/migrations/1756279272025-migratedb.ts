import { MigrationInterface, QueryRunner } from "typeorm";

export class Migratedb1756279272025 implements MigrationInterface {
    name = 'Migratedb1756279272025'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TABLE \`mahasiswa\` (\`id\` int NOT NULL AUTO_INCREMENT, \`nim\` varchar(255) NOT NULL, \`nama\` varchar(255) NOT NULL, \`email\` varchar(255) NOT NULL, PRIMARY KEY (\`id\`)) ENGINE=InnoDB`);
        await queryRunner.query(`CREATE TABLE \`pendaftaran_ta\` (\`id\` int NOT NULL AUTO_INCREMENT, \`tipeTA\` enum ('reguler', 'capstone') NOT NULL, \`jumlahAnggota\` int NOT NULL, \`judul\` text NOT NULL, \`statusTA\` enum ('baru', 'dispensasi') NOT NULL, \`resumeKebaharuan\` text NOT NULL, \`dosenPembimbing1\` varchar(255) NOT NULL, \`dosenPembimbing2\` varchar(255) NULL, \`draftTAPath\` varchar(255) NULL, \`filePendukungPath\` varchar(255) NULL, \`sumberTopik\` enum ('dosen', 'mahasiswa', 'instansi') NOT NULL, \`suratDispensasiPath\` varchar(255) NULL, \`createdAt\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6), \`updatedAt\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6), \`mahasiswaPendaftarId\` int NULL, PRIMARY KEY (\`id\`)) ENGINE=InnoDB`);
        await queryRunner.query(`CREATE TABLE \`anggota_ta\` (\`id\` int NOT NULL AUTO_INCREMENT, \`urutan\` int NOT NULL, \`createdAt\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6), \`updatedAt\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6), \`pendaftaranTAId\` int NULL, \`mahasiswaId\` int NULL, PRIMARY KEY (\`id\`)) ENGINE=InnoDB`);
        await queryRunner.query(`CREATE TABLE \`users\` (\`id\` int NOT NULL AUTO_INCREMENT, \`nim\` varchar(12) NOT NULL, \`nama\` varchar(100) NOT NULL, \`semester\` int NULL, \`nomorWhatsapp\` varchar(20) NULL, \`email\` varchar(255) NOT NULL, \`password\` varchar(255) NOT NULL, \`role\` enum ('student', 'admin', 'dosen') NOT NULL DEFAULT 'student', \`kelompok_keahlian\` enum ('RPLSI', 'AIDE', 'KMSI') NULL, \`reset_token\` varchar(255) NULL, \`reset_token_expires\` datetime NULL, \`is_active\` tinyint NOT NULL DEFAULT 1, \`last_login\` datetime NULL, \`created_at\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6), \`updated_at\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6), INDEX \`IDX_dec0bae70633e911fe6a5983c1\` (\`reset_token\`), UNIQUE INDEX \`IDX_c51bebe270592fda6d2e034730\` (\`nim\`), UNIQUE INDEX \`IDX_97672ac88f789774dd47f7c8be\` (\`email\`), PRIMARY KEY (\`id\`)) ENGINE=InnoDB`);
        await queryRunner.query(`ALTER TABLE \`pendaftaran_ta\` ADD CONSTRAINT \`FK_84b8926598e86b575cb3009c8cb\` FOREIGN KEY (\`mahasiswaPendaftarId\`) REFERENCES \`mahasiswa\`(\`id\`) ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE \`anggota_ta\` ADD CONSTRAINT \`FK_cc97938f9e93720a44bbd6d44ba\` FOREIGN KEY (\`pendaftaranTAId\`) REFERENCES \`pendaftaran_ta\`(\`id\`) ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE \`anggota_ta\` ADD CONSTRAINT \`FK_34864bc5db71011e452d9a682b2\` FOREIGN KEY (\`mahasiswaId\`) REFERENCES \`mahasiswa\`(\`id\`) ON DELETE NO ACTION ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE \`anggota_ta\` DROP FOREIGN KEY \`FK_34864bc5db71011e452d9a682b2\``);
        await queryRunner.query(`ALTER TABLE \`anggota_ta\` DROP FOREIGN KEY \`FK_cc97938f9e93720a44bbd6d44ba\``);
        await queryRunner.query(`ALTER TABLE \`pendaftaran_ta\` DROP FOREIGN KEY \`FK_84b8926598e86b575cb3009c8cb\``);
        await queryRunner.query(`DROP INDEX \`IDX_97672ac88f789774dd47f7c8be\` ON \`users\``);
        await queryRunner.query(`DROP INDEX \`IDX_c51bebe270592fda6d2e034730\` ON \`users\``);
        await queryRunner.query(`DROP INDEX \`IDX_dec0bae70633e911fe6a5983c1\` ON \`users\``);
        await queryRunner.query(`DROP TABLE \`users\``);
        await queryRunner.query(`DROP TABLE \`anggota_ta\``);
        await queryRunner.query(`DROP TABLE \`pendaftaran_ta\``);
        await queryRunner.query(`DROP TABLE \`mahasiswa\``);
    }

}
