import { MigrationInterface, QueryRunner } from "typeorm";

export class MigrationDB1760171428022 implements MigrationInterface {
    name = 'MigrationDB1760171428022'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TABLE \`final_project_periods\` (\`id\` int NOT NULL AUTO_INCREMENT, \`start_date\` varchar(255) NOT NULL, \`end_date\` varchar(255) NOT NULL, \`description\` text NULL, \`created_at\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6), \`updated_at\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6), PRIMARY KEY (\`id\`)) ENGINE=InnoDB`);
        await queryRunner.query(`CREATE TABLE \`final_projects\` (\`id\` int NOT NULL AUTO_INCREMENT, \`type\` enum ('regular', 'capstone') NOT NULL, \`status\` enum ('baru', 'dispensasi') NOT NULL, \`source_topic\` enum ('dosen', 'perusahaan', 'mandiri') NOT NULL, \`description\` text NULL, \`max_members\` int NOT NULL, \`supervisor_1_status\` enum ('pending', 'approved', 'rejected') NOT NULL DEFAULT 'pending', \`supervisor_2_status\` enum ('pending', 'approved', 'rejected') NOT NULL DEFAULT 'pending', \`admin_status\` enum ('pending', 'approved', 'rejected') NOT NULL DEFAULT 'pending', \`supervisor_1_note\` text NULL, \`supervisor_2_note\` text NULL, \`admin_note\` text NULL, \`created_at\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6), \`updated_at\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6), \`expertisesGroupId\` int NULL, \`finalProjectPeriodId\` int NULL, \`supervisor1Id\` int NULL, \`supervisor2Id\` int NULL, INDEX \`IDX_03764f7e748307adba1a3f5d7e\` (\`type\`), INDEX \`IDX_a9ad68c3934f1643dd20df3afe\` (\`admin_status\`), INDEX \`IDX_4019f707a765e3e4942e7799a7\` (\`supervisor_2_status\`), INDEX \`IDX_c294f751e1d07f982a0e69e81b\` (\`supervisor_1_status\`), PRIMARY KEY (\`id\`)) ENGINE=InnoDB`);
        await queryRunner.query(`CREATE TABLE \`final_project_members\` (\`id\` int NOT NULL AUTO_INCREMENT, \`title\` text NOT NULL, \`resume\` text NOT NULL, \`draft_path\` varchar(255) NOT NULL, \`dispen_path\` varchar(255) NOT NULL, \`created_at\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6), \`updated_at\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6), \`finalProjectId\` int NULL, \`studentId\` int NULL, INDEX \`IDX_e0191fba728c74cdbb8452f93a\` (\`studentId\`), INDEX \`IDX_0c2e21de68c277a5b190fa3c74\` (\`finalProjectId\`), UNIQUE INDEX \`REL_e0191fba728c74cdbb8452f93a\` (\`studentId\`), PRIMARY KEY (\`id\`)) ENGINE=InnoDB`);
        await queryRunner.query(`CREATE TABLE \`expertises_group\` (\`id\` int NOT NULL AUTO_INCREMENT, \`name\` varchar(255) NOT NULL, \`description\` text NULL, \`created_at\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6), \`updated_at\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6), UNIQUE INDEX \`IDX_71d9172a5c380380d622708fdf\` (\`name\`), PRIMARY KEY (\`id\`)) ENGINE=InnoDB`);
        await queryRunner.query(`CREATE TABLE \`lecturer\` (\`id\` int NOT NULL AUTO_INCREMENT, \`nip\` varchar(15) NOT NULL, \`lecturer_code\` varchar(10) NULL, \`max_supervised_1\` int NOT NULL DEFAULT '15', \`max_supervised_2\` int NOT NULL DEFAULT '15', \`created_at\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6), \`updated_at\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6), \`userId\` int NULL, \`expertisesGroupId\` int NULL, INDEX \`IDX_5cf60020bf61d6548d4457a875\` (\`lecturer_code\`), INDEX \`IDX_nip_index\` (\`nip\`), UNIQUE INDEX \`IDX_e53a53e6ec33a88ddfaf18de7a\` (\`nip\`), UNIQUE INDEX \`REL_44f207a37dc2c573af96accd92\` (\`userId\`), PRIMARY KEY (\`id\`)) ENGINE=InnoDB`);
        await queryRunner.query(`CREATE TABLE \`student\` (\`id\` int NOT NULL AUTO_INCREMENT, \`nim\` varchar(9) NULL, \`semester\` int NULL DEFAULT '7', \`created_at\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6), \`updated_at\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6), \`userId\` int NULL, INDEX \`IDX_71c81e5dd6ef31fef7deaa7f6c\` (\`semester\`), UNIQUE INDEX \`IDX_76ba8fbe0d367c1c3768a23155\` (\`nim\`), UNIQUE INDEX \`REL_b35463776b4a11a3df3c30d920\` (\`userId\`), PRIMARY KEY (\`id\`)) ENGINE=InnoDB`);
        await queryRunner.query(`CREATE TABLE \`announcements\` (\`id\` int NOT NULL AUTO_INCREMENT, \`title\` varchar(255) NOT NULL, \`content\` text NOT NULL, \`is_published\` tinyint NOT NULL DEFAULT 0, \`priority\` enum ('low', 'high') NOT NULL, \`created_at\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6), \`updated_at\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6), \`userId\` int NULL, INDEX \`IDX_39c45ab3da8f07a7c2efc3f794\` (\`is_published\`, \`created_at\`), PRIMARY KEY (\`id\`)) ENGINE=InnoDB`);
        await queryRunner.query(`CREATE TABLE \`users\` (\`id\` int NOT NULL AUTO_INCREMENT, \`googleId\` varchar(255) NULL, \`role\` enum ('student', 'admin', 'lecturer') NULL DEFAULT 'student', \`name\` varchar(255) NOT NULL, \`email\` varchar(255) NOT NULL, \`password\` varchar(255) NOT NULL, \`whatsapp_number\` varchar(20) NULL, \`reset_token\` varchar(255) NULL, \`reset_token_expires\` datetime NULL, \`is_active\` tinyint NULL DEFAULT 1, \`last_login\` datetime NULL, \`created_at\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6), \`updated_at\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6), INDEX \`IDX_dec0bae70633e911fe6a5983c1\` (\`reset_token\`), UNIQUE INDEX \`IDX_97672ac88f789774dd47f7c8be\` (\`email\`), PRIMARY KEY (\`id\`)) ENGINE=InnoDB`);
        await queryRunner.query(`CREATE TABLE \`notifications\` (\`id\` int NOT NULL AUTO_INCREMENT, \`title\` varchar(255) NOT NULL, \`message\` text NOT NULL, \`is_read\` tinyint NOT NULL DEFAULT 0, \`type\` enum ('info', 'warning', 'error', 'success') NOT NULL DEFAULT 'info', \`created_at\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6), \`updated_at\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6), PRIMARY KEY (\`id\`)) ENGINE=InnoDB`);
        await queryRunner.query(`ALTER TABLE \`final_projects\` ADD CONSTRAINT \`FK_64bfcbd5d2ebe7ad92de94e968c\` FOREIGN KEY (\`expertisesGroupId\`) REFERENCES \`expertises_group\`(\`id\`) ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE \`final_projects\` ADD CONSTRAINT \`FK_6076478253c03f77d07e572813b\` FOREIGN KEY (\`finalProjectPeriodId\`) REFERENCES \`final_project_periods\`(\`id\`) ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE \`final_projects\` ADD CONSTRAINT \`FK_91c8dcae370057405f4f79842ae\` FOREIGN KEY (\`supervisor1Id\`) REFERENCES \`lecturer\`(\`id\`) ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE \`final_projects\` ADD CONSTRAINT \`FK_2e92fc40578e98d621d5c00ce01\` FOREIGN KEY (\`supervisor2Id\`) REFERENCES \`lecturer\`(\`id\`) ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE \`final_project_members\` ADD CONSTRAINT \`FK_0c2e21de68c277a5b190fa3c744\` FOREIGN KEY (\`finalProjectId\`) REFERENCES \`final_projects\`(\`id\`) ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE \`final_project_members\` ADD CONSTRAINT \`FK_e0191fba728c74cdbb8452f93af\` FOREIGN KEY (\`studentId\`) REFERENCES \`student\`(\`id\`) ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE \`lecturer\` ADD CONSTRAINT \`FK_44f207a37dc2c573af96accd92f\` FOREIGN KEY (\`userId\`) REFERENCES \`users\`(\`id\`) ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE \`lecturer\` ADD CONSTRAINT \`FK_5650803584760eac3e1bd9f1f79\` FOREIGN KEY (\`expertisesGroupId\`) REFERENCES \`expertises_group\`(\`id\`) ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE \`student\` ADD CONSTRAINT \`FK_b35463776b4a11a3df3c30d920a\` FOREIGN KEY (\`userId\`) REFERENCES \`users\`(\`id\`) ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE \`announcements\` ADD CONSTRAINT \`FK_1968b95a7c6d64a81b1b3b5aad4\` FOREIGN KEY (\`userId\`) REFERENCES \`users\`(\`id\`) ON DELETE CASCADE ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE \`announcements\` DROP FOREIGN KEY \`FK_1968b95a7c6d64a81b1b3b5aad4\``);
        await queryRunner.query(`ALTER TABLE \`student\` DROP FOREIGN KEY \`FK_b35463776b4a11a3df3c30d920a\``);
        await queryRunner.query(`ALTER TABLE \`lecturer\` DROP FOREIGN KEY \`FK_5650803584760eac3e1bd9f1f79\``);
        await queryRunner.query(`ALTER TABLE \`lecturer\` DROP FOREIGN KEY \`FK_44f207a37dc2c573af96accd92f\``);
        await queryRunner.query(`ALTER TABLE \`final_project_members\` DROP FOREIGN KEY \`FK_e0191fba728c74cdbb8452f93af\``);
        await queryRunner.query(`ALTER TABLE \`final_project_members\` DROP FOREIGN KEY \`FK_0c2e21de68c277a5b190fa3c744\``);
        await queryRunner.query(`ALTER TABLE \`final_projects\` DROP FOREIGN KEY \`FK_2e92fc40578e98d621d5c00ce01\``);
        await queryRunner.query(`ALTER TABLE \`final_projects\` DROP FOREIGN KEY \`FK_91c8dcae370057405f4f79842ae\``);
        await queryRunner.query(`ALTER TABLE \`final_projects\` DROP FOREIGN KEY \`FK_6076478253c03f77d07e572813b\``);
        await queryRunner.query(`ALTER TABLE \`final_projects\` DROP FOREIGN KEY \`FK_64bfcbd5d2ebe7ad92de94e968c\``);
        await queryRunner.query(`DROP TABLE \`notifications\``);
        await queryRunner.query(`DROP INDEX \`IDX_97672ac88f789774dd47f7c8be\` ON \`users\``);
        await queryRunner.query(`DROP INDEX \`IDX_dec0bae70633e911fe6a5983c1\` ON \`users\``);
        await queryRunner.query(`DROP TABLE \`users\``);
        await queryRunner.query(`DROP INDEX \`IDX_39c45ab3da8f07a7c2efc3f794\` ON \`announcements\``);
        await queryRunner.query(`DROP TABLE \`announcements\``);
        await queryRunner.query(`DROP INDEX \`REL_b35463776b4a11a3df3c30d920\` ON \`student\``);
        await queryRunner.query(`DROP INDEX \`IDX_76ba8fbe0d367c1c3768a23155\` ON \`student\``);
        await queryRunner.query(`DROP INDEX \`IDX_71c81e5dd6ef31fef7deaa7f6c\` ON \`student\``);
        await queryRunner.query(`DROP TABLE \`student\``);
        await queryRunner.query(`DROP INDEX \`REL_44f207a37dc2c573af96accd92\` ON \`lecturer\``);
        await queryRunner.query(`DROP INDEX \`IDX_e53a53e6ec33a88ddfaf18de7a\` ON \`lecturer\``);
        await queryRunner.query(`DROP INDEX \`IDX_nip_index\` ON \`lecturer\``);
        await queryRunner.query(`DROP INDEX \`IDX_5cf60020bf61d6548d4457a875\` ON \`lecturer\``);
        await queryRunner.query(`DROP TABLE \`lecturer\``);
        await queryRunner.query(`DROP INDEX \`IDX_71d9172a5c380380d622708fdf\` ON \`expertises_group\``);
        await queryRunner.query(`DROP TABLE \`expertises_group\``);
        await queryRunner.query(`DROP INDEX \`REL_e0191fba728c74cdbb8452f93a\` ON \`final_project_members\``);
        await queryRunner.query(`DROP INDEX \`IDX_0c2e21de68c277a5b190fa3c74\` ON \`final_project_members\``);
        await queryRunner.query(`DROP INDEX \`IDX_e0191fba728c74cdbb8452f93a\` ON \`final_project_members\``);
        await queryRunner.query(`DROP TABLE \`final_project_members\``);
        await queryRunner.query(`DROP INDEX \`IDX_c294f751e1d07f982a0e69e81b\` ON \`final_projects\``);
        await queryRunner.query(`DROP INDEX \`IDX_4019f707a765e3e4942e7799a7\` ON \`final_projects\``);
        await queryRunner.query(`DROP INDEX \`IDX_a9ad68c3934f1643dd20df3afe\` ON \`final_projects\``);
        await queryRunner.query(`DROP INDEX \`IDX_03764f7e748307adba1a3f5d7e\` ON \`final_projects\``);
        await queryRunner.query(`DROP TABLE \`final_projects\``);
        await queryRunner.query(`DROP TABLE \`final_project_periods\``);
    }

}
