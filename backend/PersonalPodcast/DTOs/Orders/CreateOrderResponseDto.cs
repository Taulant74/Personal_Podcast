namespace PersonalPodcast.DTOs.Orders
{
    public class CreateOrderResponseDto
    {
        public int Id { get; set; }
        public int EpisodeId { get; set; }
        public DateTime CreatedAt { get; set; }
    }
}
