'use strict';

/* modal-form
 *
 * This JavaScript module creates a modal and responds to from actions
 *
 */


this.ckan.module('modal-form', function ($) {
  var api = {
    get: function (action, params, api_ver=3) {
      var base_url = ckan.sandbox().client.endpoint;
      params = $.param(params);
      var url = base_url + '/api/' + api_ver + '/action/' + action + '?' + params;
      return $.getJSON(url);
    },
    post: function (action, data, api_ver=3) {
      var base_url = ckan.sandbox().client.endpoint;
      var url = base_url + '/api/' + api_ver + '/action/' + action;
      return $.post(url, JSON.stringify(data), "json");
    }
  };

  return {
    initialize: function() {
      $.proxyAll(this, /_on/);

      this.el.on('click', this._onClick);
    },
    // Whether or not the rendered snippet has already been received from CKAN.
    _snippetReceived: false,
    _onClick: function(event) {
      if (!this._snippetReceived) {
        this.sandbox.client.getTemplate(this.options.template_file, {}, this._onReceiveSnippet);
        this._snippetReceived = true;
      } else if (this.modal) {
        this.modal.modal('show');
      }
    },
    _onReceiveSnippet: function(html) {
      this.sandbox.body.append(this.createModal(html));
      this.modal.modal('show');
    },
    createModal: function(html) {
      if (!this.modal) {
        var element = this.modal = jQuery(html);
        element.on('click', '.btn-primary', this._onSubmit);
        element.on('click', '.btn-cancel', this._onCancel);
        element.modal({show: false});
        this.modalFormError = this.modal.find('.alert-error')
      }

      return this.modal;
    },
    _onSubmit: function(event) {
      var base_url = ckan.sandbox().client.endpoint;
      var url = base_url + this.options.submit_action || '';
      var data = this.options.post_data || '';
      var form = this.modal.find('form')
      var formElements = $(form[0].elements)
      var submit = true

      // Clear form errors before submitting the form.
      this._clearFormErrors(form)

      // Add field data to payload data
      $.each(formElements, function(i, element) {
        var value = element.value.trim()

        if (element.required && value === '') {
          var hasError = element.parentElement.querySelector('.error-block')

          if (!hasError) {
            this._showInputError(element, 'Missing value')
          }

          submit = false
        } else {
          data[element.name] = element.value
        }
      }.bind(this))

      if (submit) {
        $.post(url, data, 'json')
          .done(function(data) {
            data = JSON.parse(data)

            if (data.error && data.error.message) {
              this._showFormError(data.error.message)
            } else if (data.success) {
              location.reload()
            }
          }.bind(this))
          .error(function(error) {
            this._showFormError(error)
          })
      }

    },
    _onCancel: function(event) {
      this.modal.modal('hide');
      this._snippetReceived = false;
      this._clearFormErrors()

      // Clear form fields
      this.modal.find('form')[0].reset()
    },
    _showInputError: function(element, message) {
      var span = document.createElement('span')
      span.className = 'error-block'
      span.textContent = message

      element.parentElement.appendChild(span)
    },
    _clearFormErrors: function() {
      var errors = this.modal.find('.error-block')

      $.each(errors, function(i, error) {
        error.parentElement.removeChild(error)
      })

      this.modalFormError.addClass('hide')
      this.modalFormError.text('')
    },
    _showFormError: function(message) {
      this.modalFormError.removeClass('hide')
      this.modalFormError.text(message)
    },
  };
});