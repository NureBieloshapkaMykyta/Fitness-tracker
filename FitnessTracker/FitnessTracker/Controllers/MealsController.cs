using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;
using Persistence;
using Core.Entities;
using Microsoft.EntityFrameworkCore;
using FitnessTracker.Models;
using System.Collections.Generic;

namespace FitnessTracker.Controllers;

[Authorize]
public class MealsController : Controller
{
    private readonly AppDbContext _context;
    private readonly UserManager<AppUser> _userManager;

    public MealsController(AppDbContext context, UserManager<AppUser> userManager)
    {
        _context = context;
        _userManager = userManager;
    }

    [HttpGet]
    public async Task<IActionResult> ByDate(DateTime date)
    {
        var user = await _userManager.GetUserAsync(User);
        if (user == null) return Unauthorized();
        
        var meals = await _context.Meals
            .Include(m => m.Products)
            .Where(m => m.UserId == user.Id && m.Date.Date == date.Date)
            .Select(m => new {
                m.Id,
                m.Date,
                Products = m.Products.Select(p => new {
                    p.Id,
                    p.Name,
                    p.Description,
                    p.WeightInGr,
                    p.Calories,
                    p.Proteins,
                    p.Fats,
                    p.Carbohydrates
                }).ToList()
            })
            .ToListAsync();
            
        return Json(meals);
    }

    [HttpGet]
    public IActionResult Add()
    {
        return View(new AddMealViewModel { Products = new List<ProductViewModel> { new ProductViewModel() } });
    }

    [HttpPost]
    [ValidateAntiForgeryToken]
    public async Task<IActionResult> Add(AddMealViewModel model)
    {
            
        var user = await _userManager.GetUserAsync(User);
        if (user == null) return Unauthorized();
        
        var meal = new Meal
        {
            UserId = user.Id,
            Date = model.Date,
            Products = model.Products?.Select(p => new Product
            {
                Name = p.Name,
                WeightInGr = p.WeightInGr,
                Calories = p.Calories,
                Proteins = p.Proteins,
                Fats = p.Fats,
                Carbohydrates = p.Carbohydrates,
                Description = p.Description
            }).ToList()
        };
        
        _context.Meals.Add(meal);
        await _context.SaveChangesAsync();
        return RedirectToAction("Index", "Home");
    }

    [HttpPost]
    public async Task<IActionResult> Delete(long id)
    {
        var user = await _userManager.GetUserAsync(User);
        if (user == null) return Unauthorized();
        
        var meal = await _context.Meals.FirstOrDefaultAsync(m => m.Id == id && m.UserId == user.Id);
        if (meal == null) return NotFound();
        
        _context.Meals.Remove(meal);
        await _context.SaveChangesAsync();
        return Json(new { success = true });
    }
} 