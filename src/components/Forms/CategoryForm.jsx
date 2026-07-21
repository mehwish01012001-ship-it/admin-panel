import React, { useState } from "react";
import {
  FiFolder,
  FiLink,
  FiImage,
  FiFileText,
  FiSave,
  FiTag,
} from "react-icons/fi";

import "./CategoryForm.css";

const CategoryForm = ({
  values,
  onChange,
  onSubmit,
}) => {
  const [preview, setPreview] = useState(null);

  const handleImage = (e) => {
    const file = e.target.files[0];

    if (file) {
      setPreview(URL.createObjectURL(file));
    }
  };

  return (
    <form
      className="category-form"
      onSubmit={onSubmit}
    >
      <div className="form-header">

        <div>
          <h2>Create Category</h2>
          <p>
            Manage luxury fashion product
            categories professionally
          </p>
        </div>

        <div className="header-icon">
          <FiTag />
        </div>

      </div>

      <div className="form-grid">

        <div className="left-section">

          <div className="form-group">
            <label>
              <FiFolder />
              Category Name
            </label>

            <input
              type="text"
              name="name"
              placeholder="Women's Collection"
              value={values.name}
              onChange={onChange}
              required
            />
          </div>

          <div className="form-group">
            <label>
              <FiLink />
              Category Slug
            </label>

            <input
              type="text"
              name="slug"
              placeholder="womens-collection"
              value={values.slug}
              onChange={onChange}
            />
          </div>

          <div className="form-group">
            <label>
              <FiFileText />
              Description
            </label>

            <textarea
              rows="5"
              placeholder="Category description..."
            />
          </div>

        </div>

        <div className="right-section">

          <div className="image-upload-box">

            <label className="upload-label">

              {preview ? (
                <img
                  src={preview}
                  alt="Preview"
                />
              ) : (
                <>
                  <FiImage />
                  <span>
                    Upload Category Image
                  </span>
                </>
              )}

              <input
                type="file"
                accept="image/*"
                onChange={handleImage}
                hidden
              />

            </label>

          </div>

          <div className="status-card">

            <h4>Category Status</h4>

            <select>
              <option>Active</option>
              <option>Inactive</option>
            </select>

          </div>

        </div>

      </div>

      <div className="form-footer">

        <button
          type="submit"
          className="btn-save"
        >
          <FiSave />
          Save Category
        </button>

      </div>

    </form>
  );
};

export default CategoryForm;