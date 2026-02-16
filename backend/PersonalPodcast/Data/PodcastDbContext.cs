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

            modelBuilder.Entity<User>()
                .HasIndex(u => u.Email)
                .IsUnique();

            modelBuilder.Entity<Category>().HasIndex(c => c.Name).IsUnique();

            modelBuilder.Entity<EpisodeCategory>().HasKey(ec => new { ec.EpisodeId, ec.CategoryId });

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