using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace PersonalPodcast.Migrations
{
    /// <inheritdoc />
    public partial class AddIsPremiumToEpisodes : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<bool>(
                name: "IsPremium",
                table: "Episodes",
                type: "bit",
                nullable: false,
                defaultValue: false);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "IsPremium",
                table: "Episodes");
        }
    }
}
