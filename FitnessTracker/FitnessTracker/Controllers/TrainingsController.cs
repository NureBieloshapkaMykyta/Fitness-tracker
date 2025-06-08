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
            .ToListAsync();
        return Json(trainings);
    }

    [HttpGet]
    public IActionResult Add()
    {
        return View(new AddTrainingViewModel { Exercises = new List<ExerciseViewModel> { new ExerciseViewModel() } });
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
                Description = e.Description
            }).ToList()
        };
        _context.Training.Add(training);
        await _context.SaveChangesAsync();
        return RedirectToAction("ByDate", new { date = model.Date.ToString("yyyy-MM-dd") });
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
} 