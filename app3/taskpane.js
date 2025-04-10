(function() {
    'use strict';
  
    let icsContent = null;
    let eventDetails = null;
  
    // The Office initialize function must be run each time a new page is loaded
    Office.initialize = function(reason) {
      $(document).ready(function() {
        // Initialize event handlers
        $('#extractButton').click(extractEventFromEmail);
        $('#addToCalendarButton').click(addToCalendar);
        $('#downloadIcsButton').click(downloadIcsFile);
        $('#cancelButton').click(resetForm);
      });
    };
  
    // Function to extract event details from email
    function extractEventFromEmail() {
      // Show loading indicator
      $('#loading').show();
      $('#statusMessage').empty();
      $('#eventContainer').hide();
      
      // Get the current email item
      Office.context.mailbox.item.body.getAsync(Office.CoercionType.Text, function(result) {
        if (result.status === Office.AsyncResultStatus.Succeeded) {
          const emailBody = result.value;
          
          // Call ChatGPT API to parse the email and generate ICS
          callChatGPTAPI(emailBody)
            .then(function(data) {
              // Hide loading indicator
              $('#loading').hide();
              
              if (data.success) {
                icsContent = data.icsContent;
                eventDetails = data.eventDetails;
                
                // Display event details
                displayEventDetails(eventDetails);
                $('#eventContainer').show();
                $('#statusMessage').html('<div class="success">Event details extracted successfully!</div>');
              } else {
                $('#statusMessage').html('<div class="error">Failed to extract event details: ' + data.error + '</div>');
              }
            })
            .catch(function(error) {
              // Hide loading indicator
              $('#loading').hide();
              $('#statusMessage').html('<div class="error">Error: ' + error.message + '</div>');
            });
        } else {
          // Hide loading indicator
          $('#loading').hide();
          $('#statusMessage').html('<div class="error">Error: ' + result.error.message + '</div>');
        }
      });
    }
    
    // Function to call ChatGPT API
    async function callChatGPTAPI(emailContent) {
      try {
        // Call the API proxy endpoint
        const response = await fetch('https://auto-event-gilt.vercel.app/api/generate-ics', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            emailContent: emailContent
          })
        });
        
        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || 'API request failed');
        }
        
        return await response.json();
      } catch (error) {
        return {
          success: false,
          error: error.message
        };
      }
    }
  
    // Function to display event details
    function displayEventDetails(details) {
      const eventDetailsElement = $('#eventDetails');
      eventDetailsElement.empty();
      
      // Create HTML for displaying event details
      let html = '';
      
      if (details.title) {
        html += `<div class="event-item"><span class="event-label">Title:</span> ${details.title}</div>`;
      }
      
      if (details.location) {
        html += `<div class="event-item"><span class="event-label">Location:</span> ${details.location}</div>`;
      }
      
      if (details.start) {
        const startDate = new Date(details.start);
        html += `<div class="event-item"><span class="event-label">Start:</span> ${formatDate(startDate)}</div>`;
      }
      
      if (details.end) {
        const endDate = new Date(details.end);
        html += `<div class="event-item"><span class="event-label">End:</span> ${formatDate(endDate)}</div>`;
      }
      
      if (details.description) {
        // Truncate description if it's too long
        const truncatedDesc = details.description.length > 100 
          ? details.description.substring(0, 100) + '...' 
          : details.description;
        html += `<div class="event-item"><span class="event-label">Description:</span> ${truncatedDesc}</div>`;
      }
      
      eventDetailsElement.html(html);
    }
    
    // Helper function to format date
    function formatDate(date) {
      return date.toLocaleString('en-US', { 
        weekday: 'short',
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    }
    
    // Function to add event to calendar
    function addToCalendar() {
      try {
        // Create appointment using Office.js
        const appointment = {
          subject: eventDetails.title,
          location: eventDetails.location,
          start: new Date(eventDetails.start),
          end: new Date(eventDetails.end),
          body: eventDetails.description
        };
        
        // Use Office API to create appointment
        Office.context.mailbox.displayNewAppointmentForm(appointment);
        $('#statusMessage').html('<div class="success">Calendar form opened with event details!</div>');
      } catch (error) {
        $('#statusMessage').html('<div class="error">Error creating appointment: ' + error.message + '</div>');
      }
    }
    
    // Function to download ICS file
    function downloadIcsFile() {
      if (!icsContent) {
        $('#statusMessage').html('<div class="error">No ICS content available</div>');
        return;
      }
      
      try {
        // Create a Blob with the ICS content
        const blob = new Blob([icsContent], { type: 'text/calendar' });
        
        // Create a link element and trigger download
        const link = document.createElement('a');
        link.href = window.URL.createObjectURL(blob);
        link.download = 'event.ics';
        link.click();
        
        $('#statusMessage').html('<div class="success">ICS file downloaded!</div>');
      } catch (error) {
        $('#statusMessage').html('<div class="error">Error downloading ICS file: ' + error.message + '</div>');
      }
    }
    
    // Function to reset the form
    function resetForm() {
      $('#eventContainer').hide();
      $('#eventDetails').empty();
      icsContent = null;
      eventDetails = null;
    }
  
  })();