using Microsoft.EntityFrameworkCore;
using PersonalPodcast.Models;

namespace PersonalPodcast.Data
{

    public class PodcastDbContext : DbContext
    {
        public PodcastDbContext(DbContextOptions<PodcastDbContext> options) : base(options) { }

        public DbSet<User> Users => Set<User>();
        public DbSet<Episode> Episodes => Set<Episode>();

        protected override void OnModelCreating(ModelBuilder modelBuilder)
        {

            modelBuilder.Entity<User>()
                .HasIndex(u => u.Email)
                .IsUnique();
        }
    }
}