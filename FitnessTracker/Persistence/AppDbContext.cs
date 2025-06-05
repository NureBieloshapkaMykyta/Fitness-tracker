using Core.Entities;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Identity.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace Persistence;

public class AppDbContext : IdentityDbContext<AppUser, IdentityRole<long>, long>
{
    public AppDbContext(DbContextOptions<AppDbContext> options):base(options)
    {
    }

    protected override void OnModelCreating(ModelBuilder builder)
    {
        #region

        builder.Entity<AppUser>().ToTable("Users");

        #endregion

        #region Meals

        builder.Entity<Meal>()
            .HasOne(x => x.User)
            .WithMany(x => x.Meals)
            .HasForeignKey(x => x.UserId);

        #endregion

        #region Training

        builder.Entity<Training>()
            .HasOne(x => x.User)
            .WithMany(x => x.Trainings)
            .HasForeignKey(x => x.UserId);

        #endregion

        #region Exercise

        builder.Entity<Exercise>()
            .HasOne(x => x.Training)
            .WithMany(x => x.Exercises)
            .HasForeignKey(x => x.TrainingId);

        #endregion

        #region Product

        builder.Entity<Product>()
            .HasOne(x => x.Meal)
            .WithMany(x => x.Products)
            .HasForeignKey(x => x.MealId);

        #endregion

        base.OnModelCreating(builder);
    }
    public DbSet<Exercise> Exercises { get; set; }
    public DbSet<Meal> Meals { get; set; }
    public DbSet<Product> Products { get; set; }
    public DbSet<Training> Training { get; set; }
}
