using System;
using System.Threading.Tasks;
using Microsoft.EntityFrameworkCore;
using PersonalPodcast.Data;
using PersonalPodcast.DTOs.UserDTOs;
using PersonalPodcast.Models;
using PersonalPodcast.Services;
using Xunit;

namespace PersonalPodcast.Tests;

public class UserServiceTests
{
    private sealed class FakeValidationService : IValidationService
    {
        public bool UsernameValid { get; set; } = true;
        public bool EmailValid { get; set; } = true;
        public bool PasswordValid { get; set; } = true;

        public bool IsValidUsername(string username) => UsernameValid;
        public bool IsValidEmail(string email) => EmailValid;
        public bool IsValidPassword(string password) => PasswordValid;
    }

    private static void SeedUser(
        PodcastDbContext db,
        int id,
        string username = "johnny",
        string firstName = "John",
        string lastName = "Doe",
        int? age = 20,
        string email = "john@example.com",
        string role = "Publisher",
        string passwordSalt = "salt",
        string passwordHash = "hash")
    {
        db.Users.Add(new User
        {
            Id = id,
            Username = username,
            FirstName = firstName,
            LastName = lastName,
            Age = age,
            Email = email,
            Role = role,
            PasswordSalt = passwordSalt,
            PasswordHash = passwordHash,
            CreatedAt = DateTime.UtcNow
        });
        db.SaveChanges();
    }

    [Fact]
    public async Task GetByIdAsync_WhenUserNotFound_ReturnsNull()
    {
        using var db = TestDbFactory.Create(nameof(GetByIdAsync_WhenUserNotFound_ReturnsNull));
        var validation = new FakeValidationService();
        var service = new UserService(db, validation);

        var dto = await service.GetByIdAsync(123);

        Assert.Null(dto);
    }

    [Fact]
    public async Task GetByIdAsync_WhenUserExists_ReturnsDto()
    {
        using var db = TestDbFactory.Create(nameof(GetByIdAsync_WhenUserExists_ReturnsDto));
        SeedUser(db, id: 1, username: "johnny", firstName: "John", lastName: "Doe", age: 30, email: "john@x.com", role: "Publisher");

        var validation = new FakeValidationService();
        var service = new UserService(db, validation);

        var dto = await service.GetByIdAsync(1);

        Assert.NotNull(dto);
        Assert.Equal(1, dto!.Id);
        Assert.Equal("johnny", dto.Username);
        Assert.Equal("John", dto.FirstName);
        Assert.Equal("Doe", dto.LastName);
        Assert.Equal(30, dto.Age);
        Assert.Equal("john@x.com", dto.Email);
        Assert.Equal("Publisher", dto.Role);
    }

    [Fact]
    public async Task UpdateAsync_WhenUserNotFound_ReturnsError()
    {
        using var db = TestDbFactory.Create(nameof(UpdateAsync_WhenUserNotFound_ReturnsError));
        var validation = new FakeValidationService();
        var service = new UserService(db, validation);

        var (dto, error) = await service.UpdateAsync(999, new UpdateUserDto { FirstName = "New" });

        Assert.Null(dto);
        Assert.Equal("User not found.", error);
    }

    [Fact]
    public async Task UpdateAsync_InvalidUsername_ReturnsError()
    {
        using var db = TestDbFactory.Create(nameof(UpdateAsync_InvalidUsername_ReturnsError));
        SeedUser(db, id: 1);

        var validation = new FakeValidationService { UsernameValid = false };
        var service = new UserService(db, validation);

        var (dto, error) = await service.UpdateAsync(1, new UpdateUserDto { Username = "bad!!" });

        Assert.Null(dto);
        Assert.Equal("Username cannot contain symbols. Only letters and numbers are allowed.", error);
    }

    [Fact]
    public async Task UpdateAsync_DuplicateUsername_ReturnsError()
    {
        using var db = TestDbFactory.Create(nameof(UpdateAsync_DuplicateUsername_ReturnsError));
        SeedUser(db, id: 1, username: "johnny");
        SeedUser(db, id: 2, username: "sara");

        var validation = new FakeValidationService { UsernameValid = true };
        var service = new UserService(db, validation);

        var (dto, error) = await service.UpdateAsync(1, new UpdateUserDto { Username = "sara" });

        Assert.Null(dto);
        Assert.Equal("Username already exists.", error);
    }

    [Fact]
    public async Task UpdateAsync_InvalidEmail_ReturnsError()
    {
        using var db = TestDbFactory.Create(nameof(UpdateAsync_InvalidEmail_ReturnsError));
        SeedUser(db, id: 1);

        var validation = new FakeValidationService { EmailValid = false };
        var service = new UserService(db, validation);

        var (dto, error) = await service.UpdateAsync(1, new UpdateUserDto { Email = "not-an-email" });

        Assert.Null(dto);
        Assert.Equal("Invalid email format.", error);
    }

    [Fact]
    public async Task UpdateAsync_WhenPasswordProvidedAndSaltMissing_ReturnsError()
    {
        using var db = TestDbFactory.Create(nameof(UpdateAsync_WhenPasswordProvidedAndSaltMissing_ReturnsError));
        SeedUser(db, id: 1, passwordSalt: "", passwordHash: "oldhash");

        var validation = new FakeValidationService();
        var service = new UserService(db, validation);

        var (dto, error) = await service.UpdateAsync(1, new UpdateUserDto { Password = "NewPass123" });

        Assert.Null(dto);
        Assert.Equal("Password salt missing.", error);
    }

    [Fact]
    public async Task UpdateAsync_UpdatesFields_AndReturnsUpdatedDto()
    {
        using var db = TestDbFactory.Create(nameof(UpdateAsync_UpdatesFields_AndReturnsUpdatedDto));
        SeedUser(db, id: 1, username: "johnny", firstName: "John", lastName: "Doe", age: 20, email: "john@example.com", role: "Publisher");

        var validation = new FakeValidationService { UsernameValid = true, EmailValid = true };
        var service = new UserService(db, validation);

        var req = new UpdateUserDto
        {
            Username = "johnny2",
            FirstName = "Johnny",
            LastName = "Doer",
            Age = 42,
            Email = "johnny2@example.com",
            Role = "Admin"
        };

        var (dto, error) = await service.UpdateAsync(1, req);

        Assert.Null(error);
        Assert.NotNull(dto);

        Assert.Equal(1, dto!.Id);
        Assert.Equal("johnny2", dto.Username);
        Assert.Equal("Johnny", dto.FirstName);
        Assert.Equal("Doer", dto.LastName);
        Assert.Equal(42, dto.Age);
        Assert.Equal("johnny2@example.com", dto.Email);
        Assert.Equal("Admin", dto.Role);

        var saved = await db.Users.SingleAsync(u => u.Id == 1);
        Assert.Equal("johnny2", saved.Username);
        Assert.Equal("Johnny", saved.FirstName);
        Assert.Equal("Doer", saved.LastName);
        Assert.Equal(42, saved.Age);
        Assert.Equal("johnny2@example.com", saved.Email);
        Assert.Equal("Admin", saved.Role);
    }

    [Fact]
    public async Task UpdateAsync_WhenPasswordProvided_UpdatesPasswordHash()
    {
        using var db = TestDbFactory.Create(nameof(UpdateAsync_WhenPasswordProvided_UpdatesPasswordHash));

        var salt = BCrypt.Net.BCrypt.GenerateSalt(workFactor: 10);
        var oldHash = BCrypt.Net.BCrypt.HashPassword("OldPass123", salt);

        SeedUser(db, id: 1, passwordSalt: salt, passwordHash: oldHash);

        var validation = new FakeValidationService();
        var service = new UserService(db, validation);

        var (dto, error) = await service.UpdateAsync(1, new UpdateUserDto { Password = "NewPass123" });

        Assert.Null(error);
        Assert.NotNull(dto);

        var saved = await db.Users.SingleAsync(u => u.Id == 1);
        Assert.NotEqual(oldHash, saved.PasswordHash);
        Assert.True(BCrypt.Net.BCrypt.Verify("NewPass123", saved.PasswordHash));
    }

    [Fact]
    public async Task DeleteAsync_WhenUserNotFound_ReturnsError()
    {
        using var db = TestDbFactory.Create(nameof(DeleteAsync_WhenUserNotFound_ReturnsError));
        var validation = new FakeValidationService();
        var service = new UserService(db, validation);

        var (success, error) = await service.DeleteAsync(999);

        Assert.False(success);
        Assert.Equal("User not found.", error);
    }

    [Fact]
    public async Task DeleteAsync_WhenUserExists_DeletesAndReturnsSuccess()
    {
        using var db = TestDbFactory.Create(nameof(DeleteAsync_WhenUserExists_DeletesAndReturnsSuccess));
        SeedUser(db, id: 1);

        var validation = new FakeValidationService();
        var service = new UserService(db, validation);

        var (success, error) = await service.DeleteAsync(1);

        Assert.True(success);
        Assert.Null(error);
        Assert.False(await db.Users.AnyAsync(u => u.Id == 1));
    }
}