namespace PersonalPodcast.DTOs.Episodes
{
    public class EpisodeSearchRequestDto // Ky DTO perdoret per te marre parametrat e kerkimit nga query,
                                         // si p.sh. /api/episodes/search?q=term&page=2&pageSize=10
    {
        public string? Q { get; set; }
        public string? Title { get; set; }
        public int? CategoryId { get; set; }
        public int Page { get; set; } = 1;
        public int PageSize { get; set; } = 20;
        public string? SortBy { get; set; }   // "date" (default), "title", "playCount"
        public string? SortDir { get; set; }  // "asc" ose "desc" (default "desc")

    }
}
