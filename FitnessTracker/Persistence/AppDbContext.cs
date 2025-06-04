using Microsoft.AspNetCore.Identity.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace Persistence;

public class AppDbContext : IdentityDbContext<AppUser, AppRole, long>
{
    public AppDbContext(DbContextOptions<AppDbContext> options):base(options)
    {
    }
    public DbSet<Establishment> Establishments { get; set; }
    public DbSet<Order> Orders { get; set; }

    public DbSet<Product> Products { get; set; }

    public DbSet<Sale> Sales { get; set; }

    public DbSet<StandartCompliance> StandartCompliances { get; set; }

    public DbSet<Supplier> Suppliers { get; set; }
    public DbSet<Franshise> Franshises { get; set; }
    public DbSet<MarketingCampaigns> MarketingCampaigns { get; set; }
}
