namespace PersonalPodcast.DTOs.AuthDTOs
{
    public class RegisterResponseDto
    {
        public bool success { get; set; }
        public string message { get; set; } = null!;
        public string AccessToken { get; set; } = null!;
        public string RefreshToken { get; set; } = null!;
    }
}
