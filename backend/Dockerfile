# Basic Python Web App Dockerfile Template (Running with python3 app.py)

# 1. Specify the Base Image
FROM python:3.11-slim

# 2. Set the Working Directory
WORKDIR /app

# 3. Copy Dependency Files
COPY requirements.txt .
# Add other dependency files if needed (e.g., Pipfile, pyproject.toml)

# 4. Install Dependencies
RUN pip install --no-cache-dir -r requirements.txt
# Add other install commands if needed

# 5. Copy Application Code
# This copies app.py and any other code/templates needed.
COPY . .

# 6. Expose the Port
# Make sure this port matches the one your app.py listens on.
# The default port in your original app.py was 8080 if PORT env var wasn't set.
EXPOSE 8080

# 7. Define the Command to Run the Application
# Use python3 to execute your main application script.
CMD ["python3", "app.py"]
