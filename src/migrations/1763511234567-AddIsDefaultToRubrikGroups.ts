import { MigrationInterface, QueryRunner } from "typeorm";

export class AddIsDefaultToRubrikGroups1763511234567
  implements MigrationInterface
{
  name = "AddIsDefaultToRubrikGroups1763511234567";

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE \`rubrik_groups\` ADD COLUMN \`isDefault\` tinyint NOT NULL DEFAULT 0 AFTER \`urutan\``
    );

    // Create index for faster queries
    await queryRunner.query(
      `CREATE INDEX \`IDX_rubrik_groups_isDefault\` ON \`rubrik_groups\` (\`isDefault\`)`
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `DROP INDEX \`IDX_rubrik_groups_isDefault\` ON \`rubrik_groups\``
    );
    await queryRunner.query(
      `ALTER TABLE \`rubrik_groups\` DROP COLUMN \`isDefault\``
    );
  }
}
