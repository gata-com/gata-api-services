import { MigrationInterface, QueryRunner } from "typeorm";

export class MigrationDB1756905686444 implements MigrationInterface {
    name = 'MigrationDB1756905686444'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TABLE \`users\` (\`id\` int NOT NULL AUTO_INCREMENT, \`role\` enum ('student', 'admin', 'lecturer') NOT NULL DEFAULT 'student', \`name\` varchar(255) NOT NULL, \`email\` varchar(255) NOT NULL, \`password\` varchar(255) NOT NULL, \`whatsapp_number\` varchar(20) NULL, \`reset_token\` varchar(255) NULL, \`reset_token_expires\` datetime NULL, \`is_active\` tinyint NOT NULL DEFAULT 1, \`last_login\` datetime NULL, \`created_at\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6), \`updated_at\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6), INDEX \`IDX_dec0bae70633e911fe6a5983c1\` (\`reset_token\`), UNIQUE INDEX \`IDX_97672ac88f789774dd47f7c8be\` (\`email\`), PRIMARY KEY (\`id\`)) ENGINE=InnoDB`);
        await queryRunner.query(`CREATE TABLE \`notifications\` (\`id\` int NOT NULL AUTO_INCREMENT, \`title\` varchar(255) NOT NULL, \`message\` text NOT NULL, \`isRead\` tinyint NOT NULL DEFAULT 0, \`type\` enum ('info', 'warning', 'error', 'success') NOT NULL DEFAULT 'info', \`created_at\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6), \`updated_at\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6), PRIMARY KEY (\`id\`)) ENGINE=InnoDB`);
        await queryRunner.query(`CREATE TABLE \`expertises_group\` (\`id\` int NOT NULL AUTO_INCREMENT, \`name\` enum ('RPLSI', 'AIDE', 'KMSI') NOT NULL, UNIQUE INDEX \`IDX_71d9172a5c380380d622708fdf\` (\`name\`), PRIMARY KEY (\`id\`)) ENGINE=InnoDB`);
        await queryRunner.query(`CREATE TABLE \`announcements\` (\`id\` int NOT NULL AUTO_INCREMENT, \`title\` varchar(255) NOT NULL, \`content\` text NOT NULL, \`isPublished\` tinyint NOT NULL DEFAULT 0, \`priority\` enum ('low', 'high') NOT NULL, \`created_at\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6), \`updated_at\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6), \`adminIdId\` int NULL, INDEX \`IDX_42c579bee715f9a257a4e1254d\` (\`isPublished\`, \`created_at\`), PRIMARY KEY (\`id\`)) ENGINE=InnoDB`);
        await queryRunner.query(`CREATE TABLE \`admin\` (\`id\` int NOT NULL AUTO_INCREMENT, \`created_at\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6), \`updated_at\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6), \`userIdId\` int NULL, UNIQUE INDEX \`REL_c0468f557dc6375360af52c0f7\` (\`userIdId\`), PRIMARY KEY (\`id\`)) ENGINE=InnoDB`);
        await queryRunner.query(`CREATE TABLE \`lecturer\` (\`id\` int NOT NULL AUTO_INCREMENT, \`nip\` int NOT NULL, \`lecturer_code\` varchar(10) NULL, \`max_supervised_1\` int NOT NULL DEFAULT '15', \`max_supervised_2\` int NOT NULL DEFAULT '15', \`created_at\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6), \`updated_at\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6), \`userIdId\` int NULL, \`expertisesGroupIdId\` int NULL, UNIQUE INDEX \`IDX_e53a53e6ec33a88ddfaf18de7a\` (\`nip\`), UNIQUE INDEX \`REL_264c0d34922906a6e6610eb7b0\` (\`userIdId\`), PRIMARY KEY (\`id\`)) ENGINE=InnoDB`);
        await queryRunner.query(`CREATE TABLE \`student\` (\`id\` int NOT NULL AUTO_INCREMENT, \`nim\` varchar(9) NOT NULL, \`created_at\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6), \`updated_at\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6), \`userIdId\` int NULL, UNIQUE INDEX \`IDX_76ba8fbe0d367c1c3768a23155\` (\`nim\`), UNIQUE INDEX \`REL_8d0bbcda5de9df0ec45896df5b\` (\`userIdId\`), PRIMARY KEY (\`id\`)) ENGINE=InnoDB`);
        await queryRunner.query(`CREATE TABLE \`final_projects\` (\`id\` int NOT NULL AUTO_INCREMENT, \`title\` text NOT NULL, \`type\` enum ('regular', 'capstone') NOT NULL, \`description\` text NULL, \`max_members\` int NOT NULL, \`supervisor_1_status\` enum ('pending', 'approved', 'rejected') NOT NULL DEFAULT 'pending', \`supervisor_2_status\` enum ('pending', 'approved', 'rejected') NOT NULL DEFAULT 'pending', \`admin_status\` enum ('pending', 'approved', 'rejected') NOT NULL DEFAULT 'pending', \`supervisor_1_note\` text NULL, \`supervisor_2_note\` text NULL, \`admin_note\` text NULL, \`created_at\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6), \`updated_at\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6), \`supervisor_1_id\` int NOT NULL, \`supervisor_2_id\` int NULL, \`expertisesGroupIdId\` int NULL, INDEX \`IDX_bcf3c3d97f5066de4a29aef94c\` (\`supervisor_2_id\`), INDEX \`IDX_cb8701a2280374c7009d4b5596\` (\`supervisor_1_id\`), INDEX \`IDX_03764f7e748307adba1a3f5d7e\` (\`type\`), INDEX \`IDX_a9ad68c3934f1643dd20df3afe\` (\`admin_status\`), INDEX \`IDX_4019f707a765e3e4942e7799a7\` (\`supervisor_2_status\`), INDEX \`IDX_c294f751e1d07f982a0e69e81b\` (\`supervisor_1_status\`), PRIMARY KEY (\`id\`)) ENGINE=InnoDB`);
        await queryRunner.query(`CREATE TABLE \`final_project_members\` (\`id\` int NOT NULL AUTO_INCREMENT, \`sub_title\` text NOT NULL, \`created_at\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6), \`updated_at\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6), \`finalProjectIdId\` int NULL, \`studentIdId\` int NULL, INDEX \`IDX_e82eb94deae6c3dd8b061c899c\` (\`studentIdId\`), INDEX \`IDX_958ef66b58b2e18e12f10bb384\` (\`finalProjectIdId\`), UNIQUE INDEX \`REL_e82eb94deae6c3dd8b061c899c\` (\`studentIdId\`), PRIMARY KEY (\`id\`)) ENGINE=InnoDB`);
        await queryRunner.query(`ALTER TABLE \`announcements\` ADD CONSTRAINT \`FK_d82cbae9a48e8085a09498b9b92\` FOREIGN KEY (\`adminIdId\`) REFERENCES \`admin\`(\`id\`) ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE \`admin\` ADD CONSTRAINT \`FK_c0468f557dc6375360af52c0f76\` FOREIGN KEY (\`userIdId\`) REFERENCES \`users\`(\`id\`) ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE \`lecturer\` ADD CONSTRAINT \`FK_264c0d34922906a6e6610eb7b0d\` FOREIGN KEY (\`userIdId\`) REFERENCES \`users\`(\`id\`) ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE \`lecturer\` ADD CONSTRAINT \`FK_6766300a8bdf268cafa673b8a96\` FOREIGN KEY (\`expertisesGroupIdId\`) REFERENCES \`expertises_group\`(\`id\`) ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE \`student\` ADD CONSTRAINT \`FK_8d0bbcda5de9df0ec45896df5ba\` FOREIGN KEY (\`userIdId\`) REFERENCES \`users\`(\`id\`) ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE \`final_projects\` ADD CONSTRAINT \`FK_da4d0c52fe3c79875a18c3056b0\` FOREIGN KEY (\`expertisesGroupIdId\`) REFERENCES \`expertises_group\`(\`id\`) ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE \`final_project_members\` ADD CONSTRAINT \`FK_958ef66b58b2e18e12f10bb3847\` FOREIGN KEY (\`finalProjectIdId\`) REFERENCES \`final_projects\`(\`id\`) ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE \`final_project_members\` ADD CONSTRAINT \`FK_e82eb94deae6c3dd8b061c899c1\` FOREIGN KEY (\`studentIdId\`) REFERENCES \`student\`(\`id\`) ON DELETE NO ACTION ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE \`final_project_members\` DROP FOREIGN KEY \`FK_e82eb94deae6c3dd8b061c899c1\``);
        await queryRunner.query(`ALTER TABLE \`final_project_members\` DROP FOREIGN KEY \`FK_958ef66b58b2e18e12f10bb3847\``);
        await queryRunner.query(`ALTER TABLE \`final_projects\` DROP FOREIGN KEY \`FK_da4d0c52fe3c79875a18c3056b0\``);
        await queryRunner.query(`ALTER TABLE \`student\` DROP FOREIGN KEY \`FK_8d0bbcda5de9df0ec45896df5ba\``);
        await queryRunner.query(`ALTER TABLE \`lecturer\` DROP FOREIGN KEY \`FK_6766300a8bdf268cafa673b8a96\``);
        await queryRunner.query(`ALTER TABLE \`lecturer\` DROP FOREIGN KEY \`FK_264c0d34922906a6e6610eb7b0d\``);
        await queryRunner.query(`ALTER TABLE \`admin\` DROP FOREIGN KEY \`FK_c0468f557dc6375360af52c0f76\``);
        await queryRunner.query(`ALTER TABLE \`announcements\` DROP FOREIGN KEY \`FK_d82cbae9a48e8085a09498b9b92\``);
        await queryRunner.query(`DROP INDEX \`REL_e82eb94deae6c3dd8b061c899c\` ON \`final_project_members\``);
        await queryRunner.query(`DROP INDEX \`IDX_958ef66b58b2e18e12f10bb384\` ON \`final_project_members\``);
        await queryRunner.query(`DROP INDEX \`IDX_e82eb94deae6c3dd8b061c899c\` ON \`final_project_members\``);
        await queryRunner.query(`DROP TABLE \`final_project_members\``);
        await queryRunner.query(`DROP INDEX \`IDX_c294f751e1d07f982a0e69e81b\` ON \`final_projects\``);
        await queryRunner.query(`DROP INDEX \`IDX_4019f707a765e3e4942e7799a7\` ON \`final_projects\``);
        await queryRunner.query(`DROP INDEX \`IDX_a9ad68c3934f1643dd20df3afe\` ON \`final_projects\``);
        await queryRunner.query(`DROP INDEX \`IDX_03764f7e748307adba1a3f5d7e\` ON \`final_projects\``);
        await queryRunner.query(`DROP INDEX \`IDX_cb8701a2280374c7009d4b5596\` ON \`final_projects\``);
        await queryRunner.query(`DROP INDEX \`IDX_bcf3c3d97f5066de4a29aef94c\` ON \`final_projects\``);
        await queryRunner.query(`DROP TABLE \`final_projects\``);
        await queryRunner.query(`DROP INDEX \`REL_8d0bbcda5de9df0ec45896df5b\` ON \`student\``);
        await queryRunner.query(`DROP INDEX \`IDX_76ba8fbe0d367c1c3768a23155\` ON \`student\``);
        await queryRunner.query(`DROP TABLE \`student\``);
        await queryRunner.query(`DROP INDEX \`REL_264c0d34922906a6e6610eb7b0\` ON \`lecturer\``);
        await queryRunner.query(`DROP INDEX \`IDX_e53a53e6ec33a88ddfaf18de7a\` ON \`lecturer\``);
        await queryRunner.query(`DROP TABLE \`lecturer\``);
        await queryRunner.query(`DROP INDEX \`REL_c0468f557dc6375360af52c0f7\` ON \`admin\``);
        await queryRunner.query(`DROP TABLE \`admin\``);
        await queryRunner.query(`DROP INDEX \`IDX_42c579bee715f9a257a4e1254d\` ON \`announcements\``);
        await queryRunner.query(`DROP TABLE \`announcements\``);
        await queryRunner.query(`DROP INDEX \`IDX_71d9172a5c380380d622708fdf\` ON \`expertises_group\``);
        await queryRunner.query(`DROP TABLE \`expertises_group\``);
        await queryRunner.query(`DROP TABLE \`notifications\``);
        await queryRunner.query(`DROP INDEX \`IDX_97672ac88f789774dd47f7c8be\` ON \`users\``);
        await queryRunner.query(`DROP INDEX \`IDX_dec0bae70633e911fe6a5983c1\` ON \`users\``);
        await queryRunner.query(`DROP TABLE \`users\``);
    }

}
