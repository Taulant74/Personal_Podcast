namespace PersonalPodcast.DTOs.Episodes
{
	public class UpdateEpisodeRequest
	{
		public string title { get; set; } = default!;
		public string? description { get; set; }
		public string? categoryIds { get; set; }
		public int? season { get; set; }
		public bool isPublished { get; set; }
        public bool isPremium { get; set; } = false;   
        public IFormFile? file { get; set; }
	}
}