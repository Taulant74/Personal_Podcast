namespace PersonalPodcast.DTOs.Episodes
{
    public class CreateEpisodeFormRequest
    {
        public string Title { get; set; } = default!;
        public string? Description { get; set; }
        public string? CategoryIds { get; set; }
        public int? Season { get; set; }
        public bool IsPublished { get; set; }
        public bool IsPremium { get; set; } = false;
        public IFormFile File { get; set; } = default!;
    }
}
