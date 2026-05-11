# Use Python 3.9
FROM python:3.9

# Set the working directory
WORKDIR /code

# Copy requirements and install
COPY ./requirements.txt /code/requirements.txt
RUN pip install --no-cache-dir --upgrade -r /code/requirements.txt

# Copy all project files (including your model and app.py)
COPY . .

# Command to run the Flask app
CMD ["gunicorn", "-b", "0.0.0.0:7860", "app:app"]