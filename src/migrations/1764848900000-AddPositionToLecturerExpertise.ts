import { MigrationInterface, QueryRunner, TableColumn } from "typeorm";

export class AddPositionToLecturerExpertise1764848900000
  implements MigrationInterface
{
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.addColumn(
      "lecturer_expertise",
      new TableColumn({
        name: "position",
        type: "int",
        isNullable: true,
        default: 0,
        comment:
          "Order position (1=expertise_group_1, 2=expertise_group_2, etc)",
      })
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropColumn("lecturer_expertise", "position");
  }
}
