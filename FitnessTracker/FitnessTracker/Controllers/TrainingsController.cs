using Core.Entities;
using FitnessTracker.Models;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Persistence;
using System.Collections.Generic;
using System.Text.Json.Serialization;
using System.Text.Json;
using FitnessTracker.Core.Services;

namespace FitnessTracker.Controllers;

[Authorize]
public class TrainingsController : Controller
{
    private readonly AppDbContext _context;
    private readonly UserManager<AppUser> _userManager;

    public TrainingsController(AppDbContext context, UserManager<AppUser> userManager)
    {
        _context = context;
        _userManager = userManager;
    }

    [HttpGet]
    public async Task<IActionResult> ByDate(DateTime date)
    {
        var user = await _userManager.GetUserAsync(User);
        if (user == null) return Unauthorized();
        
        var trainings = await _context.Training
            .Include(t => t.Exercises)
            .Where(t => t.UserId == user.Id && t.Date.Date == date.Date)
            .Select(t => new {
                t.Id,
                t.Description,
                t.Date,
                Exercises = t.Exercises.Select(e => new {
                    e.Id,
                    e.Name,
                    e.Duration,
                    e.Description,
                    e.CaloriesBurned
                }).ToList()
            })
            .ToListAsync();
            
        return Json(trainings);
    }

    [HttpGet]
    public IActionResult Add(DateTime? date)
    {
        return View(new AddTrainingViewModel 
        { 
            Date = date ?? DateTime.Today,
            Exercises = new List<ExerciseViewModel> { new ExerciseViewModel() } 
        });
    }

    [HttpPost]
    [ValidateAntiForgeryToken]
    public async Task<IActionResult> Add(AddTrainingViewModel model)
    {
        if (!ModelState.IsValid)
            return View(model);
            
        var user = await _userManager.GetUserAsync(User);
        if (user == null) return Unauthorized();

        var training = new Training
        {
            UserId = user.Id,
            Date = model.Date,
            Description = model.Description,
            Exercises = model.Exercises?.Select(e => new Exercise
            {
                Name = e.Name,
                Duration = e.Duration,
                Description = e.Description,
                CaloriesBurned = CalorieCalculator.CalculateCaloriesBurned(e.Name, e.Duration)
            }).ToList()
        };
        
        _context.Training.Add(training);
        await _context.SaveChangesAsync();
        return RedirectToAction("Index", "Home");
    }

    [HttpPost]
    public async Task<IActionResult> Delete(long id)
    {
        var user = await _userManager.GetUserAsync(User);
        if (user == null) return Unauthorized();
        
        var training = await _context.Training.FirstOrDefaultAsync(t => t.Id == id && t.UserId == user.Id);
        if (training == null) return NotFound();
        
        _context.Training.Remove(training);
        await _context.SaveChangesAsync();
        return Json(new { success = true });
    }

    [HttpGet]
    [Route("api/exercises")]
    public IActionResult GetAvailableExercises()
    {
        var exercises = CalorieCalculator.GetAvailableExercises();
        return Json(exercises);
    }
} 