namespace PersonalPodcast.DTOs.AuthDTOs
{
    public class LoginRequestDto
    {
        // identifier = ose username ose password. Vlera qe jan unike te ni user.
        public string Identifier { get; set; } = null!;
        public string Password { get; set; } = null!;
    }
}
