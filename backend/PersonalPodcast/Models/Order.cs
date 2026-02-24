namespace PersonalPodcast.Models
{
    public class Order
    {
        public int Id { get; set; }
        public int UserId { get; set; }
        public int EpisodeId { get; set; }
        public DateTime CreatedAt { get; set; }

        public User? User { get; set; }
        public Episode? Episode { get; set; }
    }
}
