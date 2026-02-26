namespace PersonalPodcast.DTOs.Episodes
{
    public class TopEpisodeByCategoryDto
    {
        public int CategoryId { get; set; }
        public string CategoryName { get; set; } = string.Empty;

        public int EpisodeId { get; set; }
        public string Title { get; set; } = string.Empty;
        public string? Description { get; set; }
        public string AudioUrl { get; set; } = string.Empty;
        public int DurationSeconds { get; set; }
        public DateTime? PublishedDate { get; set; }
        public int PlayCount { get; set; }

        public List<string> Categories { get; set; } = new();
    }
}
