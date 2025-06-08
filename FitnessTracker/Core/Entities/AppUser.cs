using Core.Enums;
using Microsoft.AspNetCore.Identity;

namespace Core.Entities;

public class AppUser : IdentityUser<long>
{
    public string FirstName { get; set; }
    public string LastName { get; set; }
    public Gender Gender { get; set; }
    public DateTime DateOfBirth { get; set; }
    public virtual ICollection<Training>? Trainings { get; set; }
    public virtual ICollection<Meal>? Meals { get; set; }
}
