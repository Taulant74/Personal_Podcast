namespace PersonalPodcast.Models
{

    public class Episode
    {
        public int Id { get; set; }

        // public int PublsherID -> qaj qe e bonn publish
        public string Title { get; set; } = string.Empty;
        public string? Description { get; set; }
        public string AudioUrl { get; set; } = string.Empty;
        public int DurationSeconds { get; set; }
        public int? Season { get; set; }
        public bool IsPublished { get; set; }
        public DateTime? PublishedDate { get; set; }
        public int PlayCount { get; set; }
        public int? PublisherId { get; set; }
        public User? Publisher { get; set; }
        public DateTime CreatedAt { get; set; }
        public ICollection<EpisodeCategory> EpisodeCategories { get; set; } = new List<EpisodeCategory>();
    }
}