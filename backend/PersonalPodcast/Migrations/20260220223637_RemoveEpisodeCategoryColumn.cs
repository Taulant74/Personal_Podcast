using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace PersonalPodcast.Migrations
{
    /// <inheritdoc />
    public partial class RemoveEpisodeCategoryColumn : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "Category",
                table: "Episodes");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<string>(
                name: "Category",
                table: "Episodes",
                type: "nvarchar(max)",
                nullable: true);
        }
    }
}
