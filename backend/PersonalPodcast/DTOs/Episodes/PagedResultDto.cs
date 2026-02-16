namespace PersonalPodcast.DTOs.Common
{
    public class PagedResultDto<T> //Ky DTO perdoret per ti bere page rezultatet e kerkimit.
    {
        public int Page { get; set; }
        public int PageSize { get; set; }
        public int Total { get; set; }
        public List<T> Items { get; set; } = new();
    }
}
