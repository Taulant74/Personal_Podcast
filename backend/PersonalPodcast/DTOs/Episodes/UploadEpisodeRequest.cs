namespace PersonalPodcast.DTOs.Episodes
{
    public class UploadEpisodeRequest
    {
        public string title { get; set; } = default!;
        public string? description { get; set; }
        public string? categoryIds { get; set; }
        public int? season { get; set; }
        public bool isPublished { get; set; }
        public IFormFile file { get; set; } = default!;
    }
}