using Microsoft.EntityFrameworkCore;
using PersonalPodcast.Models;

namespace PersonalPodcast.Data
{

    public class PodcastDbContext : DbContext
    {
        public PodcastDbContext(DbContextOptions<PodcastDbContext> options) : base(options) { }

        public DbSet<User> Users => Set<User>();
        public DbSet<Episode> Episodes => Set<Episode>();
        public DbSet<Category> Categories => Set<Category>();
        public DbSet<EpisodeCategory> EpisodeCategories => Set<EpisodeCategory>();
        protected override void OnModelCreating(ModelBuilder modelBuilder)
        {
            modelBuilder.Entity<User>(entity =>
            {
                entity.HasKey(u => u.Id);
                entity.Property(u => u.Id).ValueGeneratedOnAdd();

                entity.Property(u => u.Username)
                    .IsRequired()
                    .HasMaxLength(50)
                    .IsUnicode(false);

                entity.Property(u => u.FirstName)
                    .IsRequired()
                    .HasMaxLength(50)
                    .IsUnicode(false);

                entity.Property(u => u.LastName)
                    .IsRequired()
                    .HasMaxLength(50)
                    .IsUnicode(false);

                entity.Property(u => u.Age)
                    .HasColumnType("int");

                entity.Property(u => u.Email)
                    .HasMaxLength(320)
                    .IsUnicode(false);

                entity.HasIndex(u => u.Email)
                      .IsUnique()
                      .HasFilter("[Email] IS NOT NULL");

                entity.Property(u => u.PasswordHash)
                    .IsRequired()
                    .HasMaxLength(512)
                    .IsUnicode(false);

                entity.Property(u => u.PasswordSalt)
                    .IsRequired()
                    .HasMaxLength(128)
                    .IsUnicode(false);

                entity.Property(u => u.Role)
                    .IsRequired()
                    .HasMaxLength(20)
                    .IsUnicode(false)
                    .HasDefaultValue("User");

                entity.ToTable("Users", t =>
                {
                    t.HasCheckConstraint("CK_User_Role_Values", "[Role] IN ('User', 'Publisher', 'Admin')");
                    t.HasCheckConstraint("CK_User_Age_Range", "[Age] IS NULL OR ([Age] >= 8 AND [Age] <= 120)");
                });

                entity.Property(u => u.CreatedAt)
                      .HasDefaultValueSql("GETUTCDATE()")
                      .IsRequired();
            });

            modelBuilder.Entity<Category>().HasIndex(c => c.Name).IsUnique();

            modelBuilder.Entity<EpisodeCategory>().HasKey(ec => new { ec.EpisodeId, ec.CategoryId });

            modelBuilder.Entity<Episode>()
            .HasIndex(e => e.PublisherId);

            modelBuilder.Entity<Episode>()
                .HasOne(e => e.Publisher)
                .WithMany()
                .HasForeignKey(e => e.PublisherId)
                .OnDelete(DeleteBehavior.SetNull);

            modelBuilder.Entity<EpisodeCategory>()
                .HasOne(ec => ec.Episode)
                .WithMany(e => e.EpisodeCategories)
                .HasForeignKey(ec => ec.EpisodeId)
                .OnDelete(DeleteBehavior.Cascade);

            modelBuilder.Entity<EpisodeCategory>()
                .HasOne(ec => ec.Category)
                .WithMany(c => c.EpisodeCategories)
                .HasForeignKey(ec => ec.CategoryId)
                .OnDelete(DeleteBehavior.Cascade);
        }
    }
}