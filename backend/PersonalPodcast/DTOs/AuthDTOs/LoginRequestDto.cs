namespace PersonalPodcast.DTOs.AuthDTOs
{
    public class LoginRequestDto
    {
        // identifier = ose username ose email. Vlera qe jan unike te ni user.
        public string Identifier { get; set; } = null!;
        public string Password { get; set; } = null!;
    }
}
