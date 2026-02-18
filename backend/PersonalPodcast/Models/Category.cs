namespace PersonalPodcast.Models
{
    public class Category
    {
        public int Id { get; set; }
        public string Name { get; set; } = string.Empty;

        public ICollection<EpisodeCategory> EpisodeCategories { get; set; } = new List<EpisodeCategory>();
    }
}