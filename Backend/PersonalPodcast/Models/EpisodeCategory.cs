namespace PersonalPodcast.Models {
    public class EpisodeCategory {
        public int EpisodeId { get; set; }
        public int CategoryId { get; set; }

        public Episode? Episode { get; set; }
        public Category? Category { get; set; }
    }
}
