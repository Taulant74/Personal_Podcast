using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace PersonalPodcast.Migrations
{
    /// <inheritdoc />
    public partial class AddPublisherToEpisodes : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<int>(
                name: "PublisherId",
                table: "Episodes",
                type: "int",
                nullable: true);

            migrationBuilder.CreateIndex(
                name: "IX_Episodes_PublisherId",
                table: "Episodes",
                column: "PublisherId");

            migrationBuilder.AddForeignKey(
                name: "FK_Episodes_Users_PublisherId",
                table: "Episodes",
                column: "PublisherId",
                principalTable: "Users",
                principalColumn: "Id",
                onDelete: ReferentialAction.SetNull);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_Episodes_Users_PublisherId",
                table: "Episodes");

            migrationBuilder.DropIndex(
                name: "IX_Episodes_PublisherId",
                table: "Episodes");

            migrationBuilder.DropColumn(
                name: "PublisherId",
                table: "Episodes");
        }
    }
}
