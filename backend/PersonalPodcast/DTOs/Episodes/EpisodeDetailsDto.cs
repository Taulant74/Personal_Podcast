namespace PersonalPodcast.DTOs.Episodes
{
    public class EpisodeDetailsDto
    {
        public int Id { get; set; }
        public string Title { get; set; } = string.Empty;
        public string? Description { get; set; }
        public string AudioUrl { get; set; } = string.Empty;
        public int DurationSeconds { get; set; }
        public int? Season { get; set; }

        public bool IsPublished { get; set; }
        public DateTime? PublishedDate { get; set; }

        public int PlayCount { get; set; }
        public DateTime CreatedAt { get; set; }

        public string? Category { get; set; }
    }
}
