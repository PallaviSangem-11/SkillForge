import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import api from '../../api/axiosConfig';
import { DIFFICULTY_LEVELS, getDifficultyDisplayName } from '../../utils/roles';

const AddCourse = () => {
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    difficultyLevel: DIFFICULTY_LEVELS.BEGINNER,
    estimatedDuration: '',
    prerequisites: '',
    materials: [''],
  });
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleMaterialChange = (index, value) => {
    setFormData((prev) => {
      const materials = [...(prev.materials || [])];
      materials[index] = value;
      return { ...prev, materials };
    });
  };

  const addMaterial = () => {
    setFormData((prev) => ({ ...prev, materials: [...(prev.materials || []), ''] }));
  };

  const removeMaterial = (index) => {
    setFormData((prev) => {
      const materials = [...(prev.materials || [])];
      materials.splice(index, 1);
      return { ...prev, materials };
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      // Ensure estimatedDuration is sent as integer (or null) and filter empty material links
      const payload = {
        ...formData,
        estimatedDuration: formData.estimatedDuration ? parseInt(formData.estimatedDuration, 10) : null,
        materials: (formData.materials || []).filter((m) => m && m.trim() !== ''),
      };

      const response = await api.post('/courses', payload);
      toast.success('Course created successfully!');
      navigate('/instructor/courses');
    } catch (error) {
      const errorMessage = error.response?.data?.message || 'Failed to create course';
      toast.error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Create New Course</h1>
        <p className="text-gray-600 mt-2">
          Fill in the details below to create a new course for your students.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="card space-y-6">
        <div>
          <label htmlFor="title" className="block text-sm font-medium text-gray-700 mb-2">
            Course Title *
          </label>
          <input
            type="text"
            id="title"
            name="title"
            required
            className="input-field"
            placeholder="Enter course title"
            value={formData.title}
            onChange={handleChange}
          />
        </div>

        <div>
          <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-2">
            Description *
          </label>
          <textarea
            id="description"
            name="description"
            required
            rows={4}
            className="input-field"
            placeholder="Describe what students will learn in this course"
            value={formData.description}
            onChange={handleChange}
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label htmlFor="difficultyLevel" className="block text-sm font-medium text-gray-700 mb-2">
              Difficulty Level *
            </label>
            <select
              id="difficultyLevel"
              name="difficultyLevel"
              required
              className="input-field"
              value={formData.difficultyLevel}
              onChange={handleChange}
            >
              {Object.values(DIFFICULTY_LEVELS).map((level) => (
                <option key={level} value={level}>
                  {getDifficultyDisplayName(level)}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label htmlFor="estimatedDuration" className="block text-sm font-medium text-gray-700 mb-2">
              Estimated Duration (hours)
            </label>
            <input
              type="number"
              id="estimatedDuration"
              name="estimatedDuration"
              min="1"
              className="input-field"
              placeholder="e.g., 10"
              value={formData.estimatedDuration}
              onChange={handleChange}
            />
          </div>
        </div>

        <div>
          <label htmlFor="prerequisites" className="block text-sm font-medium text-gray-700 mb-2">
            Prerequisites
          </label>
          <textarea
            id="prerequisites"
            name="prerequisites"
            rows={3}
            className="input-field"
            placeholder="List any prerequisites for this course (optional)"
            value={formData.prerequisites}
            onChange={handleChange}
          />
        </div>

        <div>
          <label htmlFor="materials-0" className="block text-sm font-medium text-gray-700 mb-2">Materials (links)</label>
          <div className="space-y-2">
            {(formData.materials || []).map((m, idx) => (
              <div key={idx} className="flex items-center space-x-2">
                <input
                  type="url"
                  id={`materials-${idx}`}
                  name={`materials[${idx}]`}
                  className="input-field flex-1"
                  placeholder="https://example.com/resource"
                  value={m}
                  onChange={(e) => handleMaterialChange(idx, e.target.value)}
                />
                <button type="button" onClick={() => removeMaterial(idx)} className="btn-secondary">Remove</button>
              </div>
            ))}

            <div>
              <button type="button" onClick={addMaterial} className="btn-primary">Add Material</button>
            </div>
          </div>
        </div>

        <div className="flex justify-end space-x-4">
          <button
            type="button"
            onClick={() => navigate('/instructor/courses')}
            className="btn-secondary"
            disabled={isLoading}
          >
            Cancel
          </button>
          <button
            type="submit"
            className="btn-primary"
            disabled={isLoading}
          >
            {isLoading ? 'Creating...' : 'Create Course'}
          </button>
        </div>
      </form>
    </div>
  );
};

export default AddCourse;
