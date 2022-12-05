import { Component, OnInit } from '@angular/core';
import { FormGroup, FormBuilder, Validators } from '@angular/forms';
import { Store } from '@ngrx/store';
import { AppState } from './../../../../store/model/appState.model';
import { IBookAndCottagePayload } from '../../../../globals/interface/book';
import { EMage } from '../../../../globals/enums/image';
import * as moment from 'moment';
import { SnackBarService } from '../../../../shared/services/snack-bar.service';
import { StoreService } from '../../../../store/service/store.service';
import { BookService } from './book.service';
import { IBookingPayload, IUser, TProps } from '../../../../globals/interface/payload';
import { CommonServiceService } from '../../../../globals/services/common-service.service';

@Component({
  selector: 'app-book',
  templateUrl: './book.component.html',
  styleUrls: ['./book.component.css']
})
export class BookComponent implements OnInit {
	isEditable = false;
	bookForm!: FormGroup;
	cottageForm!: FormGroup;
	paymentForm!: FormGroup;
	base64 = EMage.BASE64_INITIAL;
	file!: File;
	receiptPhoto: string = "assets/receipt.jpg";

	dataCottageBook!: IBookAndCottagePayload[];

	startDate: string = "";
	endDate: string = "";
	numberOfDays: number = 0;
	totalAmount: number = 0;

	user!: IUser;

  constructor(
		private fb: FormBuilder, 
		private store: Store<AppState>, 
		private snackBar: SnackBarService,
		private store_method: StoreService,
		private http_book: BookService,
		private common: CommonServiceService,
		) {

		store.select("user").subscribe((data): void => {
			try {
				this.user = data[0];
			} catch (Err) {
				return undefined
			}
		});

		this.paymentForm = this.fb.group({
			accountName: [null, Validators.required],
			accountNumber: [null, Validators.required],
			reference: [null, Validators.required],
			amount: [null, Validators.required],
			images: [null, Validators.required],
			remarks: null,

		});

		this.cottageForm = this.fb.group({
			type: ['Floating cottage', Validators.required],
			availableCottage: [null, Validators.required],
			event: ['Birthday', Validators.required],
		});

		/**
		 * display cottage book
		 */

		store.select("cottage").subscribe((data): void => {
			try {
				this.dataCottageBook = data;

				this.startDate = moment(data[0].selected_date_from).format("MM-DD-YYYY");
				this.endDate = moment(data[0].selected_date_to).format("MM-DD-YYYY");

				const totalDays = this.common.diff_minutes(new Date(data[0].selected_date_to), new Date(data[0].selected_date_from));

				this.numberOfDays = totalDays;

				this.totalAmount = totalAmount(this.dataCottageBook);

			} catch (err) {
				return undefined
			}
			
		});

	}

	get accountName () {
		return this.bookForm.get('accountName');
	}
	get accountNumber () {
		return this.bookForm.get('accountNumber');
	}
	get reference () {
		return this.bookForm.get('reference');
	}
	get amount () {
		return this.bookForm.get('amount');
	}
	get remarks () {
		return this.bookForm.get('remarks');
	}
	get firstname () {
		return this.bookForm.get('firstname');
	}

	get lastname () {
		return this.bookForm.get('lastname');
	}

	get contact () {
		return this.bookForm.get('contact');
	}

	get address () {
		return this.bookForm.get('address');
	}

	get start () {
		return this.bookForm.get('start');
	}

	get end () {
		return this.bookForm.get('end');
	}

	get comment () {
		return this.bookForm.get('comment');
	}

  ngOnInit(): void {
		
		this.bookForm = this.fb.group({
			firstname: [(!this.user)? null: this.user.firstname, Validators.required],
			lastname: [(!this.user)? null: this.user.lastname, Validators.required],
			contact: [(!this.user)? null: this.user.mobile_number, Validators.required],
			email: null,
			address:[(!this.user)? null: this.user.address, Validators.required],
			
			isCottage: [null, Validators.required],
			comment: null,

			roles: [(!this.user)? JSON.stringify(["guest"]) : this.user.role]

		});

		this.bookForm.patchValue({isCottage: this.dataCottageBook.length > 0 ? 1 : null});
  }

	onNextBook(): void {
		if(this.bookForm.invalid || this.dataCottageBook.length === 0) {
			this.bookForm.markAllAsTouched();
			this.snackBar._showSnack("Oops! Something went wrong", "error");
		} else {

		}
	}

	changeImage(event: any) {

		this.file = event.target.files[0];

		const reader = new FileReader();
		
		reader.readAsDataURL(this.file);

		reader.onload = (event: any) => {
			this.receiptPhoto = event.target.result
		}

		this.paymentForm.get('images')?.patchValue(this.file);

	}

	async submit () {
		if (this.paymentForm.invalid) {
			this.paymentForm.markAllAsTouched();
		} else {
			const formData = new FormData();

			/**
			 * 
			 * Flatten the object and get only the cottage id,
			 * As it will automatically associate all cottage data using the id
			 */
			const selectedCottages: [id: number] = [...this.dataCottageBook].map((item: IBookAndCottagePayload) => item.id) as [id: number]

			// Getting the selected dates
			const selectedDates: {from: Date; to: Date} = [...this.dataCottageBook].filter((item: IBookAndCottagePayload) => {
				return ("selected_date_from" in item && item["selected_date_from"]) && ("selected_date_to" in item && item["selected_date_to"])
			}).map((item: IBookAndCottagePayload) => {
				return {
					from: item.selected_date_from,
					to: item.selected_date_to
				}
			})[0];

			// User details
			const userDetails = { ...this.bookForm.value }

			// Payment details
			const paymentDetails = { ...this.paymentForm.value, images: undefined }

			// Extracting payment method from previous object then adding it to paymentDetails object
			paymentDetails["payment_type"] = [...this.dataCottageBook].find((item: IBookAndCottagePayload) => "payment_type" in item && item["payment_type"])?.payment_type

			// Other details, comment, etc.
			const otherDetails = "comment" in userDetails && userDetails["comment"]
				? { comment: userDetails.comment }
				: {};

			// Receipt attachment
			const receipt: File = this.paymentForm.value && this.paymentForm.value["images"]
				? this.paymentForm.value["images"]
				: null;

			// Final cleanup
			if ("comment" in userDetails) {
				delete userDetails["comment"]
			}

			if ("images" in paymentDetails) {
				delete paymentDetails["images"]
			}

			const payload: IBookingPayload = {
				cottages: [...selectedCottages],
				dates: {...selectedDates},
				user: {...userDetails},
				payment: {...paymentDetails},
				other: {...otherDetails}
			}

			

			for (let item of Object.keys(payload)) {
				let props: TProps = item as TProps

				const value: string = payload[props] as unknown as string
				
				formData.append(props, JSON.stringify(value))
			}

			formData.append("images", receipt);

			const response = await this.http_book.bookCottage(formData);

			this.snackBar._showSnack(response.message, "success");	
			
		}
	}

	cancelCottage(element: IBookAndCottagePayload) {
		this.store_method.deleteCottage(element.id);
		this.snackBar._showSnack("Cottage Successfully cancelled!", "success");
	}

	
}

const totalAmount = (data: IBookAndCottagePayload[]): number => {
	let total = 0;
	data.forEach((x) => (total += x.price));

	return total
}
