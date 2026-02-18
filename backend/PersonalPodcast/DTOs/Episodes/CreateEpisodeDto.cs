namespace PersonalPodcast.DTOs.Episodes
{
    public class CreateEpisodeDto
    {
        public string Title { get; set; } = "";
        public string? Description { get; set; }
        public int DurationSeconds { get; set; }
        public string? Category { get; set; }
        public int? Season { get; set; }
        public bool IsPublished { get; set; } = true;

        public IFormFile AudioFile { get; set; } = default!;
    }
}
