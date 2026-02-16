namespace PersonalPodcast.DTOs.Episodes
{
    public class EpisodeSearchRequestDto // Ky DTO perdoret per te marre parametrat e kerkimit nga query,
                                         // si p.sh. /api/episodes/search?q=term&page=2&pageSize=10
    {
        public string? Q { get; set; }
        public int Page { get; set; } = 1;
        public int PageSize { get; set; } = 20;
    }
}
