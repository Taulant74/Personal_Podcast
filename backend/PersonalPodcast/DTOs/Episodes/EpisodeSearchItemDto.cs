namespace PersonalPodcast.DTOs.Episodes
{
    public class EpisodeSearchItemDto //Ky DTO perdoret per te shfaqur rezultatet e kerkimit
                                      //dhe per te shfaqur informacionin bazik te episodeve ne listen e rezultateve
    {
        public int Id { get; set; }
        public string Title { get; set; } = string.Empty;
        public string? Description { get; set; }
        public string AudioUrl { get; set; } = string.Empty;
        public int DurationSeconds { get; set; }
        public DateTime? PublishedDate { get; set; }
        public int PlayCount { get; set; }
        public string? Category { get; set; }
    }
}
